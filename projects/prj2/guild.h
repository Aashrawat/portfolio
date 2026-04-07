/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: FEB10
*/
#ifndef SENECA_GUILD_H
#define SENECA_GUILD_H

#include <cstddef>
#include <string>
#include "character.h"

namespace seneca {

    class Guild {
        std::string m_name{};
        Character** m_members{ nullptr };
        size_t      m_size{ 0 };

        void clear_();
        void copyFrom_(const Guild& other);
        void moveFrom_(Guild&& other) noexcept;

    public:
        // default constructor
        Guild() = default;

        // custom constructor
        Guild(const char* name);

        // rule of 5
        ~Guild();
        Guild(const Guild& other);
        Guild& operator=(const Guild& other);
        Guild(Guild&& other) noexcept;
        Guild& operator=(Guild&& other) noexcept;

        void addMember(Character* c);
        void removeMember(const std::string& c);

        Character* operator[](size_t idx) const;

        void showMembers() const;
    };

} // namespace seneca

#endif
