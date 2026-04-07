/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: FEB10
*/
#include "guild.h"
#include <iostream>

namespace seneca {

    Guild::Guild(const char* name) : m_name(name ? name : "") {
        // no members initially
    }

    void Guild::clear_() {
        delete[] m_members;     
        m_members = nullptr;
        m_size = 0;
    }

    void Guild::copyFrom_(const Guild& other) {
        m_name = other.m_name;
        m_size = other.m_size;
        m_members = nullptr;

        if (m_size > 0) {
            m_members = new Character * [m_size];
            for (size_t i = 0; i < m_size; ++i) {
                m_members[i] = other.m_members[i]; 
            }
        }
    }

    void Guild::moveFrom_(Guild&& other) noexcept {
        m_name = std::move(other.m_name);
        m_members = other.m_members;
        m_size = other.m_size;

        other.m_members = nullptr;
        other.m_size = 0;
        other.m_name.clear();
    }

    Guild::~Guild() {
        clear_();
    }

    Guild::Guild(const Guild& other) {
        copyFrom_(other);
    }

    Guild& Guild::operator=(const Guild& other) {
        if (this != &other) {
            clear_();
            copyFrom_(other);
        }
        return *this;
    }

    Guild::Guild(Guild&& other) noexcept {
        moveFrom_(std::move(other));
    }

    Guild& Guild::operator=(Guild&& other) noexcept {
        if (this != &other) {
            clear_();
            moveFrom_(std::move(other));
        }
        return *this;
    }

    void Guild::addMember(Character* c) {
        if (!c) return;

        
        for (size_t i = 0; i < m_size; ++i) {
            if (m_members[i] == c) return;
        }

      
        Character** temp = new Character * [m_size + 1];
        for (size_t i = 0; i < m_size; ++i) {
            temp[i] = m_members[i];
        }
        temp[m_size] = c;

        delete[] m_members;
        m_members = temp;
        ++m_size;

        
        c->setHealthMax(c->getHealthMax() + 300);
    }

    void Guild::removeMember(const std::string& c) {
        if (m_size == 0) return;

        size_t pos = m_size; 
        for (size_t i = 0; i < m_size; ++i) {
            if (m_members[i] && m_members[i]->getName() == c) {
                pos = i;
                break;
            }
        }
        if (pos == m_size) return; 
        if (m_members[pos]) {
            m_members[pos]->setHealthMax(m_members[pos]->getHealthMax() - 300);
        }

        
        if (m_size == 1) {
            delete[] m_members;
            m_members = nullptr;
            m_size = 0;
            return;
        }

        Character** temp = new Character * [m_size - 1];
        for (size_t i = 0, j = 0; i < m_size; ++i) {
            if (i != pos) {
                temp[j++] = m_members[i];
            }
        }

        delete[] m_members;
        m_members = temp;
        --m_size;
    }

    Character* Guild::operator[](size_t idx) const {
        if (idx >= m_size) return nullptr;
        return m_members[idx];
    }

    void Guild::showMembers() const {
      
        if (m_name.empty()) {
            std::cout << "No guild.\n";
            return;
        }

        std::cout << "[Guild] " << m_name << "\n";
        for (size_t i = 0; i < m_size; ++i) {
            std::cout << "    " << (i + 1) << ": " << *m_members[i] << "\n";
        }
    }

} 
